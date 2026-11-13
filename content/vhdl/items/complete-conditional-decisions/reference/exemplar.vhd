library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        request : in std_logic;
        blocked : in std_logic;
        boost : in std_logic;
        fan_on : out std_logic;
        speed : out std_logic_vector(1 downto 0)
    );
end entity;

architecture rtl of top_module is
begin
    process(all) begin
        fan_on <= '0'; speed <= "00";
        if request = '1' and blocked = '0' then fan_on <= '1'; if boost = '1' then speed <= "10"; else speed <= "01"; end if; end if;
    end process;
end architecture;
