library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (lamps : in std_logic_vector(11 downto 0);
    limit : in std_logic_vector(3 downto 0);
    count : out std_logic_vector(3 downto 0);
    over_limit : out std_logic);
end entity;
architecture rtl of top_module is
    begin
    process(all) variable n:unsigned(3 downto 0);
        begin n:=(others=>'0');
        for i in lamps'range loop if lamps(i)='1' then n:=n+1;
        end if;
    end loop;
    count<=std_logic_vector(n);
    if n>unsigned(limit) then over_limit<='1';
    else over_limit<='0';
    end if;
end process;
end architecture;
