library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity sample_register is
    port (
    clk : in std_logic;
    reset : in std_logic;
    data : in std_logic_vector(7 downto 0);
    q : out std_logic_vector(7 downto 0)
    );
end entity;
architecture rtl of sample_register is
    begin
    process(clk)
        begin
        if falling_edge(clk) then
            if reset='1' then q<=(others=>'0');
            else q<=data;
            end if;
        end if;
    end process;
end architecture;
