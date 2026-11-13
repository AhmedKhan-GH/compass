library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (samples : in std_logic_vector(7 downto 0);
    inverted : out std_logic_vector(7 downto 0);
    ones : out std_logic_vector(3 downto 0));
end entity;
architecture rtl of top_module is
    begin
    inverted <= not samples;
    process(all) variable n:unsigned(3 downto 0);
        begin n:=(others=>'0');
        for i in samples'range loop if samples(i)='1' then n:=n+1;
        end if;
    end loop;
    ones<=std_logic_vector(n);
end process;
end architecture;
